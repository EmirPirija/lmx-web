
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
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
    <form className="flex flex-col gap-6" onSubmit={Signin}>
      <div className="labelInputCont">
        <Label className="requiredInputLabel">{t("username")}</Label>
        <Input
          type="text"
          placeholder={t("typeUsername")}
          name="username"
          required
          onChange={(e) => setUsername(e.target.value)}
          value={username}
        />
      </div>

      <div className="labelInputCont">
        <Label className="requiredInputLabel">{t("password")}</Label>
        <div className="flex items-center relative">
          <Input
            type={IsPasswordVisible ? "text" : "password"}
            placeholder={t("enterPassword")}
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="absolute ltr:right-3 rtl:left-3 cursor-pointer"
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
        className="text-xl text-white font-light px-4 py-2"
        size="big"
      >
        {showLoader ? (
          <div className="loader-container-otp">
            <div className="loader-otp"></div>
          </div>
        ) : (
          <span>{t("verifyEmail")}</span>
        )}
      </Button>
    </form>
  );
};

export default RegPasswordForm;
