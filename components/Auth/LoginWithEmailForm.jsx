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
import { userSignUpApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { Fcmtoken } from "@/redux/reducer/settingSlice";
import { loadUpdateData } from "@/redux/reducer/authSlice";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import { useState } from "react";

const LoginWithEmailForm = ({ OnHide }) => {
  const emailRef = useAutoFocus();
  const auth = getAuth();
  const fetchFCM = useSelector(Fcmtoken);
  const [loginStates, setLoginStates] = useState({
    email: "",
    password: "",
    IsPasswordVisible: false,
    showLoader: false,
  });

  const { email, password, IsPasswordVisible, showLoader } = loginStates;

  const signin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (!userCredential?.user) {
        toast.error(t("userNotFound"));
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

    if (!email) {
      toast.error(t("emailRequired"));
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error(t("emailInvalid"));
      return;
    } else if (!password) {
      toast.error(t("passwordRequired"));
      return;
    } else if (password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }

    try {
      setLoginStates((prev) => ({ ...prev, showLoader: true }));
      const userCredential = await signin(email, password);
      const user = userCredential.user;
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
        toast.error(t("verifyEmailFirst"));
      }
    } catch (error) {
      const errorCode = error.code;
      console.log("Error code:", errorCode);
      handleFirebaseAuthError(errorCode);
    } finally {
      setLoginStates((prev) => ({ ...prev, showLoader: false }));
    }
  };

  const handleForgotModal = async (e) => {
    e.preventDefault();
    await sendPasswordResetEmail(auth, email)
      .then(() => {
        toast.success(t("resetPassword"));
      })
      .catch((error) => {
        console.log("error", error);
        handleFirebaseAuthError(error?.code);
      });
  };

  return (
    <>
      <form
        className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        onSubmit={Signin}
      >
        <div className="labelInputCont">
          <Label className="requiredInputLabel text-sm font-semibold text-slate-700">
            {t("email")}
          </Label>
          <Input
            type="email"
            placeholder={t("enterEmail")}
            value={email}
            className="h-11 rounded-xl"
            autoComplete="email"
            onChange={(e) =>
              setLoginStates((prev) => ({ ...prev, email: e.target.value }))
            }
            ref={emailRef}
          />
        </div>
        <div className="labelInputCont">
          <Label className="requiredInputLabel text-sm font-semibold text-slate-700">
            {t("password")}
          </Label>
          <div className="flex items-center relative">
            <Input
              type={IsPasswordVisible ? "text" : "password"}
              placeholder={t("enterPassword")}
              className="h-11 rounded-xl ltr:pr-10 rtl:pl-10"
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
              className="absolute ltr:right-3 rtl:left-3 cursor-pointer"
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
            {t("forgtPassword")}
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
            t("signIn")
          )}
        </Button>
      </form>
    </>
  );
};

export default LoginWithEmailForm;
