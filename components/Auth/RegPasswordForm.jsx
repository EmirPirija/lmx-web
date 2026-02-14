import { FaRegEye, FaRegEyeSlash } from "@/components/Common/UnifiedIconPack";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const RegPasswordForm = ({
  username,
  setUsername,
  password,
  setPassword,
  IsPasswordVisible,
  setIsPasswordVisible,
  showLoader,
  Signin,
  t,
}) => {
  return (
    <form
      className="flex flex-col gap-5 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-sm sm:p-5"
      onSubmit={Signin}
    >
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
        Postavi korisničko ime i lozinku kako bi završio registraciju.
      </div>

      <div className="labelInputCont">
        <Label className="requiredInputLabel text-sm font-semibold text-slate-700">
          {t("username")}
        </Label>
        <Input
          type="text"
          placeholder={t("typeUsername")}
          name="username"
          required
          className="h-11 rounded-xl border-slate-200 bg-white"
          autoComplete="username"
          onChange={(e) => setUsername(e.target.value)}
          value={username}
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
            id="password"
            name="password"
            className="h-11 rounded-xl border-slate-200 bg-white ltr:pr-10 rtl:pl-10"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="absolute ltr:right-3 rtl:left-3 cursor-pointer text-slate-500 hover:text-slate-700"
            type="button"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
          >
            {IsPasswordVisible ? (
              <FaRegEye size={20} />
            ) : (
              <FaRegEyeSlash size={20} />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={showLoader}
        className="h-11 rounded-xl text-sm font-semibold"
        size="lg"
      >
        {showLoader ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span>{t("verifyEmail")}</span>
        )}
      </Button>
    </form>
  );
};

export default RegPasswordForm;
